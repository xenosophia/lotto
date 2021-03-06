import { useState, useRef, useEffect, useCallback } from "react";
import styled, { keyframes } from "styled-components";
import { Radio, Button, Anchor } from "antd";
import Layout, { AppTitle, PageTitle } from "@components/Layout";
import Result from "@components/Result";
import Wrapper from "@components/Wrapper";
import { useRouter } from "next/router";
import LottoGenService from "@service/LottoGenService";
import Question from "@model/Question";
import { RESULT_TYPE } from "@lib/enums";
import { PsyResult, LottoResult } from "@lib/types";
import PsyTest from "@lib/PsyTest";

const PsyWrapper = styled(Wrapper)`
    .form {
        display: flex;
        flex-direction: column;
    }
    .questionWrapper {
        display: flex;
        flex-direction: column;
        justify-content: center;
        text-align: center;
        .question-title {
            margin: 10px 0;
            font-size: 1.3rem;
        }
    }
    .question {
        display: flex;
        flex-direction: column;
        text-align: center;
        > label {
            margin: 5px;
        }
    }
    .navWrapper {
        margin-top: 10px;
        display: flex;
        justify-content: space-around;
        > div {
            width: 50px;
        }
        .navBtn {
            text-align: center;
            border-radius: 25px;
            background-color: rgb(46, 86, 179);
            color: white;
            padding: 5px 5px;
            width: 80px;
            white-space: nowrap;
            font-weight: 400;
            span {
                position: relative;
                top: 1px;
            }
            cursor: pointer;
        }
    }
    .result {
        margin: 20px 0;
    }

    .resetBtn{
        padding-right : 5px;
        text-align : right;
        cursor : pointer;
        color : rgb(30, 50, 140);
    }

    @media only screen and (min-width: 768px) {
    }
`;

export default function Home() {
    const [psyTest, setPsyTest] = useState(PsyTest);
    const [questionId, setQuestionId] = useState(psyTest[0].id);
    const selectElement = useRef<HTMLDivElement>(null);
    const [lottoResult, setLottoResult] = useState<LottoResult | null>(null);
    const [loading, setLoading] = useState(false);
    const animationTiming = {
        duration: 300,
    };
    const fadeInAnimation = [{ opacity: 0 }, { opacity: 1 }];
    useEffect(()=>{
        return ()=>{
            reset();
        }
    },[])

    const submitForm = async () => {
        try {
            if (loading) return;
            setLoading(true);
            if (
                !psyTest[psyTest.length - 1]?.selected ||
                typeof psyTest[psyTest.length - 1]?.selected === "undefined"
            ) {
                alert("답변을 골라주세요.");
                return;
            }
            const quote = psyTest.reduce(
                (prev, cur) => prev + cur?.selected?.toString(),
                "",
            );
            const numbers: number[] = await LottoGenService.genNumbersByQuote(
                quote,
            );
            const psyResult: PsyResult = {
                numbers,
                type: RESULT_TYPE.PSY,
            };
            setLottoResult(psyResult);
        } catch (err) {
            alert(
                "번호 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
            );
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    const renderQuestionNav = useCallback(() => {
        const question: Question | undefined = psyTest.find(
            (q) => q.id === questionId,
        );
        return (
            <div className="navWrapper">
                {questionId === psyTest[0].id ? (
                    <div />
                ) : (
                        <div
                            onClick={() => {
                                if (loading) return;
                                selectElement?.current?.animate(
                                    fadeInAnimation,
                                    animationTiming,
                                );
                                setQuestionId(questionId - 1);
                            }}
                            className="prevBtn navBtn"
                        >
                            <span>이전</span>
                        </div>
                    )}
                {questionId === psyTest[psyTest.length - 1].id ? (
                    <div className="nextBtn navBtn" onClick={submitForm}>
                        <span>결과 보기</span>
                    </div>
                ) : (
                        <div
                            onClick={() => {
                                if (loading) return;
                                if (
                                    !question?.selected ||
                                    typeof question?.selected === "undefined"
                                ) {
                                    alert("답변을 골라주세요.");
                                    return;
                                }
                                selectElement?.current?.animate(
                                    fadeInAnimation,
                                    animationTiming,
                                );
                                setQuestionId(questionId + 1);
                            }}
                            className="nextBtn navBtn"
                        >
                            <span>다음</span>
                        </div>
                    )}
            </div>
        );
    }, [questionId, psyTest]);

    const reset = () => {

        setPsyTest(psyTest.map(question => {
            delete question.selected;
            return question;
        }));
        setQuestionId(PsyTest[0].id);
    };
    const renderQuestion = useCallback(() => {
        return psyTest.map((question, index) => {
            if (question.id !== questionId) {
                return null;
            }
            const onChange = (e: any) => {
                setPsyTest(
                    psyTest.map((q) => {
                        if (q.id === question.id) {
                            q.selected = e.target.value;
                        }
                        return q;
                    }),
                );
            };
            return (
                <div className="questionWrapper" key={index}>
                    <p className="question-title">{question.title}</p>
                    <p
                        className="resetBtn"
                        onClick={reset}
                    >
                        초기화
                    </p>
                    <Radio.Group
                        className={`question`}
                        options={question.options}
                        onChange={onChange}
                        value={question.selected}
                        optionType="button"
                        buttonStyle="solid"
                        size="large"
                    />
                </div>
            );
        });
    }, [questionId, psyTest]);



    return (
        <Layout>
            <AppTitle>육성장군</AppTitle>
            <PageTitle>심리테스트로 만들기</PageTitle>
            <PsyWrapper>
                {lottoResult ? (
                    <>
                        <Result className="result" result={lottoResult}></Result>
                    </>
                ) : (
                        <>
                            <div ref={selectElement} className="form">
                                {renderQuestion()}
                            </div>
                            {renderQuestionNav()}
                        </>
                    )}
            </PsyWrapper>
        </Layout>
    );
}
